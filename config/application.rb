require File.expand_path('../boot', __FILE__)

require "rails"
# Pick the frameworks you want:
require "active_model/railtie"
require "active_job/railtie"
# require "active_record/railtie"
require "action_controller/railtie"
require "action_mailer/railtie"
require "action_view/railtie"
require "sprockets/railtie"
# require "rails/test_unit/railtie"

# Require the gems listed in Gemfile, including any gems
# you've limited to :test, :development, or :production.
Bundler.require(*Rails.groups)

module ImpacExpress
  class Application < Rails::Application
    config.generators do |g|
      g.test_framework :rspec, fixture: false
      g.view_specs false
      g.helper_specs false
    end

  config.action_mailer.delivery_method = :smtp
    config.action_mailer.smtp_settings = {
      :authentication => :plain,
      address: ENV['SMTP_HOST'],
      port: ENV['SMTP_PORT'],
      domain: ENV['SMTP_DOMAIN'],
      user_name: ENV['SMTP_USERNAME'],
      password: ENV['SMTP_PASSWORD']
    }

    # Settings in config/environments/* take precedence over those specified here.
    # Application configuration should go into files in config/initializers
    # -- all .rb files in that directory are automatically loaded.

    # Set Time.zone default to the specified zone and make Active Record auto-convert to this zone.
    # Run "rake -D time" for a list of tasks for finding time zone names. Default is UTC.
    # config.time_zone = 'Central Time (US & Canada)'

    # The default locale is :en and all translations from config/locales/*.rb,yml are auto loaded.
    # config.i18n.load_path += Dir[Rails.root.join('my', 'locales', '*.{rb,yml}').to_s]
    # config.i18n.default_locale = :de

    # STDOUT logging for Rails 4
    # For Rails 5 see https://github.com/heroku/rails_12factor#rails-5-and-beyond
    if ENV["RAILS_LOG_TO_STDOUT"].present?
      log_level = ([(ENV['LOG_LEVEL'] || ::Rails.application.config.log_level).to_s.upcase, "INFO"] & %w[DEBUG INFO WARN ERROR FATAL UNKNOWN]).compact.first
      logger = ::ActiveSupport::Logger.new(STDOUT)
      logger.formatter = proc do |severity, datetime, progname, msg|
        "#{datetime} #{severity}: #{String === msg ? msg : msg.inspect}\n"
      end
      logger = ActiveSupport::TaggedLogging.new(logger) if defined?(ActiveSupport::TaggedLogging)
      logger.level = ::ActiveSupport::Logger.const_get(log_level)
      config.logger = logger

      STDOUT.sync = true
    end

    # CORS
    config.middleware.insert_before 0, 'Rack::Cors' do
      allow do
        allowed_headers = ['X-Requested-With', 'X-Prototype-Version', 'Accept', 'Content-Type', 'x-xsrf-token', 'Authorization', 'Origin']

        origins 'localhost:7001'

        resource '/mnoe/jpi/v1/current_user',
          headers: allowed_headers,
          methods: [:get, :options]

        resource '/mnoe/auth/users/*',
          headers: allowed_headers,
          methods: [:get, :post, :put, :delete, :options]

        resource '/mnoe/jpi/v1/impac/*',
          headers: allowed_headers,
          methods: [:get, :post, :put, :delete, :options]
      end
    end
  end
end
