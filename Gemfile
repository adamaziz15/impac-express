source 'https://rubygems.org'

gem 'rails', '~> 4.2.6'

# Maestrano Enterprise Engine
# Edge mnoe
# gem 'mno-enterprise', path: '../../mno-enterprise'
gem 'mno-enterprise', '3.3.0'

# Use puma as the app server
gem 'puma'

gem 'sparkpost', '~> 0.1.4'

# Background jobs
gem 'sucker_punch', '~> 2.0'

# Use SCSS for stylesheets
gem 'sass-rails', '~> 5.0'
# Use Uglifier as compressor for JavaScript assets
gem 'uglifier', '>= 1.3.0'

# CORS
gem 'rack-cors'

# Ops gems
group :uat, :production do
  gem 'newrelic_rpm'
end

# CI gems
group :development do
  # Security audits
  gem 'brakeman', require: false
  gem 'bundler-audit', require: false

  # Style check
  gem 'rubocop', '~> 0.39', require: false
  gem 'rubocop-rspec', require: false
end

group :development, :test do

  # Spring speeds up development by keeping your application running in the background. Read more: https://github.com/rails/spring
  gem 'spring'
  gem 'spring-commands-rspec'
end

group :test do
  gem 'rspec-rails'
  gem 'factory_girl_rails'
  gem 'shoulda-matchers'

  # Code coverage
  gem 'simplecov'
end
