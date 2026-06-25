class MessagesController < ApplicationController
  def create
    @message = Message.new(message_params)

    if @message.valid?
      begin
        MessageMailer.contact_message(@message).deliver_now

        respond_to do |format|
          format.turbo_stream { render "pages/kontakt_success" }
          format.html { redirect_to kontakt_path, notice: "Děkujeme, ozveme se vám." }
        end
      rescue StandardError => e
        Rails.logger.error("Contact form delivery failed: #{e.class} - #{e.message}")
        @message.errors.add(:base, "Zprávu se nepodařilo odeslat. Zkuste to prosím znovu.")
        render_invalid_message(status: :internal_server_error)
      end
    else
      render_invalid_message(status: :unprocessable_entity)
    end
  end

  private

  def render_invalid_message(status:)
    respond_to do |format|
      format.turbo_stream do
        render turbo_stream: turbo_stream.replace(
          "contact-form-wrapper",
          partial: "pages/contact_form",
          locals: { message: @message }
        ), status: status
      end
      format.html do
        render "pages/kontakt", status: status
      end
    end
  end

  def message_params
    params.require(:message).permit(:name, :email, :phone, :body)
  end
end
