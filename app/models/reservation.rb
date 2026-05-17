require "uri/mailto"

class Reservation
  include ActiveModel::Model
  include ActiveModel::Attributes

  attribute :name, :string
  attribute :email, :string
  attribute :phone, :string
  attribute :apartment, :string
  attribute :date_from, :string
  attribute :date_to, :string
  attribute :guests, :integer
  attribute :note, :string

  validates :name, :email, :date_from, :date_to, :guests, presence: true
  validates :email, format: { with: URI::MailTo::EMAIL_REGEXP }, allow_blank: true
  validates :guests, numericality: { only_integer: true, greater_than: 0 }, allow_blank: true
end
