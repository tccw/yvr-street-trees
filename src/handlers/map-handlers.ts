import { point } from "@turf/turf";
import { useState } from "react";
import { Client } from "../api-client/client";
import UserPhotoFeature from "../api-client/types";

const LONGEST_SIDE = 1024;
const apiClient: Client = new Client();

function UploadImageFile(feature: UserPhotoFeature, image: Blob) {
    let formData = new FormData();
    formData.append("feature", JSON.stringify(feature));
    formData.append("image", image);
    let requestOptions = {
        request_body: formData
    }

    apiClient.userphotos.postUserPhoto(requestOptions)
        .then(response => console.log(response))
        .catch(error => {
            console.log(error)
        });
}

function MakeUserPhotoFeature(latitude: number, longitude: number) {
    // GeoJSON requires [long, lat] order
    const coordinates = [longitude, latitude]
    const userEntry: UserPhotoFeature = point(coordinates);
    return userEntry;
}


function convertAndValidateImage(file: Blob): Promise<Blob> {
    return new Promise((resolve, reject) => {
        let image = new Image();
        image.src = URL.createObjectURL(file);
        image.onload = () => {
            if (image.width <= LONGEST_SIDE && image.height <= LONGEST_SIDE)
                resolve(file)

            const {width, height} = calcNewWidthAndHeight(image.width, image.height, LONGEST_SIDE)
            let canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;

            let context = canvas.getContext('2d');

            context?.drawImage(image, 0, 0, width, height);

            canvas.toBlob(resolve, "image/jpeg", 1);
        };
        image.onerror = reject;
        }

    )
}

function calcNewWidthAndHeight(
    srcWidth: number,
    srcHeight: number,
    maxSideLength: number): {width: number, height: number} {
        let ratios = [maxSideLength / srcWidth, maxSideLength / srcHeight ];
        let ratio: number = Math.min(ratios[0], ratios[1]);

        return { width:srcWidth*ratio, height:srcHeight*ratio };
 }

export { UploadImageFile, MakeUserPhotoFeature };
