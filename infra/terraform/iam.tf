resource "aws_iam_role" "app" {
  name = "SignalDeskEc2EcrReader"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "ec2.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })
  tags = local.common_tags
}

resource "aws_iam_role_policy" "app_ecr" {
  name = "PullSignalDeskImages"
  role = aws_iam_role.app.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = "ecr:GetAuthorizationToken"
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "ecr:BatchCheckLayerAvailability",
          "ecr:GetDownloadUrlForLayer",
          "ecr:BatchGetImage"
        ]
        Resource = [
          "arn:aws:ecr:us-east-2:376896792178:repository/signaldesk-api",
          "arn:aws:ecr:us-east-2:376896792178:repository/signaldesk-web"
        ]
      }
    ]
  })
}

resource "aws_iam_instance_profile" "app" {
  name = "SignalDeskEc2EcrReader"
  role = aws_iam_role.app.name
  tags = local.common_tags
}