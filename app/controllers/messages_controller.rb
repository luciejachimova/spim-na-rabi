class MessagesController < ApplicationController
  def create
    @message = Message.new(message_params)

    respond_to do |format|
      if @message.valid?
        format.turbo_stream { render "pages/kontakt_success" }
        format.html { redirect_to kontakt_path, notice: "Děkujeme, ozveme se vám." }
      else
        format.turbo_stream do
          render turbo_stream: turbo_stream.replace(
            "contact-form-wrapper",
            partial: "pages/contact_form",
            locals: { message: @message }
          ), status: :unprocessable_entity
        end
        format.html { render "pages/kontakt", status: :unprocessable_entity }
      end
    end
  end

  private

  def message_params
    params.require(:message).permit(:name, :email, :phone, :body)
  end
end
