declare module 'cloudinary-react' {
  import { Component } from 'react';

  export interface CloudinaryContextProps {
    cloudName: string;
    [key: string]: any;
  }

  export interface ImageProps {
    publicId: string;
    width?: number;
    height?: number;
    crop?: string;
    quality?: string;
    format?: string;
    [key: string]: any;
  }

  export interface VideoProps {
    publicId: string;
    width?: number;
    height?: number;
    controls?: boolean;
    [key: string]: any;
  }

  export class CloudinaryContext extends Component<CloudinaryContextProps> {}
  export class Image extends Component<ImageProps> {}
  export class Video extends Component<VideoProps> {}
  export class Transformation extends Component<any> {}
}
