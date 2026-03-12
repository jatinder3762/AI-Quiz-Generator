from io import BytesIO
from uuid import uuid4

import boto3

from app.core.config import get_settings


class StorageService:
    def __init__(self) -> None:
        settings = get_settings()
        self.bucket = settings.s3_bucket_name
        self.s3 = boto3.client(
            "s3",
            endpoint_url=settings.s3_endpoint_url,
            aws_access_key_id=settings.s3_access_key_id,
            aws_secret_access_key=settings.s3_secret_access_key,
            region_name=settings.s3_region,
        )

    def upload_file(self, content: bytes, filename: str, content_type: str) -> str:
        unique_name = f"uploads/{uuid4()}-{filename}"
        self.s3.upload_fileobj(
            Fileobj=BytesIO(content),
            Bucket=self.bucket,
            Key=unique_name,
            ExtraArgs={"ContentType": content_type},
        )
        return f"s3://{self.bucket}/{unique_name}"
