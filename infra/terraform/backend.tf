terraform {
  backend "s3" {
    bucket              = "signaldesk-tfstate-376896792178-us-east-2"
    key                 = "dev/terraform.tfstate"
    region              = "us-east-2"
    encrypt             = true
    use_lockfile        = true
    allowed_account_ids = ["376896792178"]
  }
}