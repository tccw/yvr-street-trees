import {
    FeatureCollection,
    Properties,
  } from "@turf/turf";

type UserPhotoResponse = {
    type: string;
    data: FeatureCollection
}

type UserPhotoProperties = {
    public_id: string;
    full_size_url: string;
    created_at_utc: Date;
}
