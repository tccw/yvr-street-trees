import { point } from "@turf/turf";
import { useState } from "react";
import { Client, TreemapResponse } from "../api-client/client";
import UserPhotoFeature from "../api-client/types";

const LONGEST_SIDE = 1024;
const apiClient: Client = new Client();

async function UploadImageFile(feature: UserPhotoFeature, image: Blob, callBack?: CallableFunction) {
    let formData = new FormData();

    image = await convertAndValidateImage(image);

    formData.append("feature", JSON.stringify(feature));
    formData.append("image", image);
    let requestOptions = {
        request_body: formData
    }

    let apiResponse: TreemapResponse | any;
    apiClient.userphotos.postUserPhoto(requestOptions)
        .then(response => {
            apiResponse = response;
        })
        .catch(error => {
            apiResponse = error;
        })
        .finally( () => {
            if (callBack)
                callBack(apiResponse);
        }
        );
}

function MakeUserPhotoFeature(coords: GeolocationCoordinates | {latitude: number, longitude: number}) {
    // GeoJSON requires [long, lat] order
    const coordinates = [coords.longitude, coords.latitude]
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
            // @ts-ignore
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

 function tryGetUserLocation(): Promise<GeolocationPosition> {
    return new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
    });
}

export { UploadImageFile, MakeUserPhotoFeature, tryGetUserLocation };
