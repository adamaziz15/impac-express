# TODO: to remove once changes merged in mnoe
HealthCheck.setup do |config|
  # You can customize which checks happen on a standard health check
  config.standard_checks = %w(site cache)

  # You can set what tests are run with the 'full' or 'all' parameter
  config.full_checks = %w(site cache custom)
end
