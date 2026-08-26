import boto3
import subprocess
import sys


BOOTSTRAP_BUCKET_NAME = "eks-platform-dev-020139096715-ap-south-1"
BOOTSTRAP_BUCKET_REGION = "ap-south-1"

TERRAFORM_DIR = "./terraform/bootstrap"

s3 = boto3.client("s3")


def check_bucket(bucket_name, bucket_region):
    """
    Check whether the bootstrap S3 bucket exists
    and is in the expected AWS region.
    """

    try:
        s3.head_bucket(Bucket=bucket_name)

        actual_region = s3.get_bucket_location(
            Bucket=bucket_name
        ).get("LocationConstraint")

        # AWS returns None for us-east-1
        if actual_region is None:
            actual_region = "us-east-1"

        print(f"Bucket found: {bucket_name}")
        print(f"Bucket region: {actual_region}")

        if actual_region != bucket_region:
            print(
                f"Region mismatch: expected {bucket_region}, "
                f"but bucket is in {actual_region}"
            )
            return False

        return True

    except s3.exceptions.ClientError as e:

        error_code = e.response["Error"]["Code"]

        if error_code in ("404", "NoSuchBucket"):
            print(f"Bucket does not exist: {bucket_name}")

        elif error_code == "403":
            print(
                f"Bucket exists, but you don't have permission "
                f"to access it: {bucket_name}"
            )

        else:
            print(f"AWS error: {e}")

        return False


def run_terraform_init():
    print("\nBootstrap bucket not found.")
    print("Running Terraform initialization...\n")

    result = subprocess.run(
        ["terraform", "init"],
        cwd=TERRAFORM_DIR,
        check=False
    )

    if result.returncode != 0:
        print("Terraform init failed.")
        sys.exit(result.returncode)

    apply = subprocess.run(
        ["terraform", "apply", "--auto-approve"],
        cwd=TERRAFORM_DIR,
        check=False
    )

    if apply.returncode != 0:
        print("Terraform apply failed.")
        sys.exit(result.returncode)


    print("Terraform init completed successfully.")


def bootstrap():
    bucket_exists = check_bucket(
        BOOTSTRAP_BUCKET_NAME,
        BOOTSTRAP_BUCKET_REGION
    )

    if bucket_exists:
        print("\nBootstrap infrastructure already exists.")
        return

    run_terraform_init()


def cleanup():
    print("\nRunning terraform destroy...")

    result = subprocess.run(
        [
            "terraform",
            "destroy",
            "--auto-approve"
        ],
        cwd=TERRAFORM_DIR,
        check=False
    )

    if result.returncode != 0:
        print("Terraform destroy failed.")
        sys.exit(result.returncode)

    print("Terraform destroy completed successfully.")


def main():

    options = {
        "1": "Bootstrap",
        "2": "Cleanup",
        "3": "Exit"
    }

    print("\nAvailable options:")

    for key, value in options.items():
        print(f"{key}. {value}")

    choice = input("\nEnter your choice: ").strip()

    if choice == "1":
        bootstrap()

    elif choice == "2":
        cleanup()

    elif choice == "3":
        print("Exiting...")

    else:
        print("Invalid choice.")


if __name__ == "__main__":
    main()
