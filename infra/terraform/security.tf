resource "aws_security_group" "app" {
  name        = "launch-wizard-1"
  description = "launch-wizard-1 created 2026-09-24T15:35:38.113Z"
  vpc_id      = data.aws_vpc.existing.id

  tags = local.common_tags
  lifecycle {
    prevent_destroy = true
  }
}

resource "aws_vpc_security_group_ingress_rule" "operator_ssh" {
  security_group_id = aws_security_group.app.id
  ip_protocol       = "tcp"
  from_port         = 22
  to_port           = 22
  cidr_ipv4         = var.operator_ipv4_cidr

  tags = local.common_tags
  lifecycle {
    prevent_destroy = true
  }
}

resource "aws_vpc_security_group_ingress_rule" "instance_connect" {
  security_group_id = aws_security_group.app.id
  ip_protocol       = "tcp"
  from_port         = 22
  to_port           = 22
  prefix_list_id    = "pl-03915406641cb1f53"

  tags = local.common_tags
  lifecycle {
    prevent_destroy = true
  }
}

resource "aws_vpc_security_group_ingress_rule" "operator_ssh_443" {
  security_group_id = aws_security_group.app.id
  ip_protocol       = "tcp"
  from_port         = 443
  to_port           = 443
  cidr_ipv4         = var.operator_ipv4_cidr

  tags = local.common_tags
  lifecycle {
    prevent_destroy = true
  }
}

resource "aws_vpc_security_group_egress_rule" "outbound" {
  security_group_id = aws_security_group.app.id
  ip_protocol       = "-1"
  cidr_ipv4         = "0.0.0.0/0"

  tags = local.common_tags
  lifecycle {
    prevent_destroy = true
  }
}

resource "aws_vpc_security_group_ingress_rule" "public_web" {
  for_each = {
    http  = 80
    https = 443
  }

  security_group_id = aws_security_group.app.id
  ip_protocol       = "tcp"
  from_port         = each.value
  to_port           = each.value
  cidr_ipv4         = "0.0.0.0/0"

  tags = local.common_tags
}