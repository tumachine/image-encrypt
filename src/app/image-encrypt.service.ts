import { Injectable } from '@angular/core';
import { FileMeta, ImageEncrypt, ImageMetaInfo } from './image-encrypt';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { AES, enc } from 'crypto-js';

@Injectable({
  providedIn: 'root'
})
export class ImageEncryptService {
  constructor(private http: HttpClient) {}

  private metadataBitLength = 32;

  loadRandomImageSrc(): Observable<string> {
    const url = 'https://source.unsplash.com/random';
    return this.http.get(url, { responseType: 'arraybuffer' })
      .pipe(map(data => window.URL.createObjectURL(new Blob([data]))));
  }

  async createImage(src: string): Promise<HTMLImageElement> {
    return new Promise(resolve => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.src = src;
    })
  }

  async encodeData(meta: ImageMetaInfo, files: File[], imageData: ImageData, password: null | string = null): Promise<{ meta: ImageMetaInfo, imageData: ImageData }> {
    const filesInfo: FileMeta[] = [];
    const fileBinaryStrings: string[] = [];
    for (let i = 0; i < files.length; i++) {
      const buffer = await files[i].arrayBuffer();
      const fileBinaryString = ImageEncrypt.convertToBinaryString(buffer);

      filesInfo.push({ size: fileBinaryString.length, name: files[i].name })
      fileBinaryStrings.push(fileBinaryString);
    }

    meta.files = filesInfo;

    let metadataBuffer: ArrayBuffer;
    if (password) {
      const encryptedMeta = AES.encrypt(JSON.stringify(meta), password).toString();
      metadataBuffer = await ImageEncrypt.convertDataToBuffer(encryptedMeta);
    } else {
      metadataBuffer = await ImageEncrypt.convertDataToBuffer(JSON.stringify(meta));
    }

    const metadataBinaryString = ImageEncrypt.convertToBinaryString(metadataBuffer);
    const binaryStringOfMetadataLength = metadataBinaryString.length.toString(2).padStart(this.metadataBitLength, '0');

    const endImageIndexOfMetadataLength = await ImageEncrypt.encodeBinaryString(imageData, 0, [2, 2, 2], binaryStringOfMetadataLength);
    const endImageIndexOfMetadata = await ImageEncrypt.encodeBinaryString(imageData, endImageIndexOfMetadataLength, [2, 2, 2], metadataBinaryString);

    let startOfData = endImageIndexOfMetadata;

    for (let i = 0; i < filesInfo.length; i++) {
      startOfData = await ImageEncrypt.encodeBinaryString(imageData, startOfData, [meta.r, meta.g, meta.b], fileBinaryStrings[i]);
    }

    return { imageData, meta };
  }

  async decodeData(imageData: ImageData, password: null | string = null): Promise<{ meta: ImageMetaInfo, files: File[] }> {
    const decodedLengthOfMetadata = ImageEncrypt.decodePixelsRange(imageData.data, 0, this.metadataBitLength, [2, 2, 2]);
    const lengthOfMetadataInBytes = parseInt(decodedLengthOfMetadata.binaryString, 2);

    const lengthOfMetadataInKilobytes = lengthOfMetadataInBytes / 8 / 1024;

    if (lengthOfMetadataInKilobytes > 10) {
      throw new Error('Invalid metadata length');
    }

    const decodedMetadata = ImageEncrypt.decodePixelsRange(imageData.data, decodedLengthOfMetadata.nextPixelIndex, lengthOfMetadataInBytes, [2, 2, 2]);
    const decodedMetadataBuffer = ImageEncrypt.convertBinaryStringToBuffer(decodedMetadata.binaryString);
    const metadataBlob = new Blob([decodedMetadataBuffer]);
    const metadataText = await metadataBlob.text();
    let meta: ImageMetaInfo;

    if (password) {
      const decrypted = AES.decrypt(metadataText, password).toString(enc.Utf8);
      meta = JSON.parse(decrypted);
    } else {
      meta = JSON.parse(metadataText);
    }

    let decodedData = decodedMetadata;

    const files = [];
    for (let i = 0; i < meta.files.length; i++) {
      decodedData = ImageEncrypt.decodePixelsRange(imageData.data, decodedData.nextPixelIndex, meta.files[i].size, [meta.r, meta.g, meta.b]);
      const decodedBuffer = ImageEncrypt.convertBinaryStringToBuffer(decodedData.binaryString);
      const file = new File([decodedBuffer], meta.files[i].name)
      files.push(file);
    }

    return { meta, files };
  }
}
