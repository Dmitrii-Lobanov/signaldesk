resource "aws_instance" "app" {
  ami           = "ami-0e5497a77ef21b5ac"
  instance_type = "m7i-flex.large"
  key_name      = "signaldesk_001"

  subnet_id              = data.aws_subnet.existing.id
  private_ip             = "172.31.39.204"
  vpc_security_group_ids = [aws_security_group.app.id]

  monitoring              = false
  disable_api_termination = false

  metadata_options {
    http_endpoint               = "enabled"
    http_tokens                 = "required"
    http_put_response_hop_limit = 2
    http_protocol_ipv6          = "disabled"
    instance_metadata_tags      = "disabled"
  }

  root_block_device {
    volume_type           = "gp3"
    volume_size           = 30
    iops                  = 3000
    throughput            = 125
    encrypted             = false
    delete_on_termination = true
  }

  tags = merge(local.common_tags, {
    Name = "signaldesk-dev"
  })

  lifecycle {
    prevent_destroy = true
  }
}