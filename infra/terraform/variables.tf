variable "operator_ipv4_cidr" {
  description = "Existing IPv4 /32 allowed administrative access."
  type        = string
  sensitive   = true

  validation {
    condition = (
      can(cidrnetmask(var.operator_ipv4_cidr)) &&
      endswith(var.operator_ipv4_cidr, "/32")
    )
    error_message = "Provide a valid IPv4 CIDR ending in /32."
  }
}