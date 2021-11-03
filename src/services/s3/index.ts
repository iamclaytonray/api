import * as AWS from 'aws-sdk';
import * as uuid from 'uuid';

export async function uploadFile(file: any): Promise<any> {
  try {
    const { data: Body, name } = file;

    const S3 = new AWS.S3();
    const Key = `uploads/${uuid.v4()}-${name}`;

    const s3Res = await S3.upload({
      ACL: 'public-read',
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key,
      Body,
    }).promise();

    return s3Res.Location;
  } catch (error) {
    return error;
  }
}
