class MessageMailer < ApplicationMailer
  def contact_message(message)
    @message = message

    mail(
      to: smtp_to_address,
      from: smtp_from_address,
      reply_to: @message.email,
      subject: "Nová zpráva z formuláře Spim na Rabí"
    )
  end

  private

  def smtp_from_address
    ENV["SMTP_FROM"] || Rails.application.credentials.dig(:smtp, :from) || "no-reply@spimnarabi.cz"
  end

  def smtp_to_address
    ENV["CONTACT_INBOX"] || Rails.application.credentials.dig(:smtp, :to) || "spimnarabi@seznam.cz"
  end
end
