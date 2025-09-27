import { Feature, feature, Point } from "@turf/turf";

interface UserPhotoProperties {
    created_at_utc?: Date;
    public_id?: string;
    full_size_url: string;
}

interface UserPhotoFeature extends Feature<Point, UserPhotoFeature> {};


export default UserPhotoFeature;