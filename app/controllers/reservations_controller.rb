class ReservationsController < ApplicationController
  def create
    @reservation = Reservation.new(reservation_params)

    respond_to do |format|
      if @reservation.valid?
        format.turbo_stream { render "reservations/success" }
        format.html { redirect_to root_path, notice: "Děkujeme, ozveme se vám s potvrzením rezervace." }
      else
        format.turbo_stream do
          render turbo_stream: turbo_stream.replace(
            "reservation_form",
            partial: "shared/reservation_form",
            locals: { reservation: @reservation }
          ), status: :unprocessable_entity
        end
        format.html { render "pages/home", status: :unprocessable_entity }
      end
    end
  end

  private

  def reservation_params
    params.require(:reservation).permit(:name, :email, :phone, :apartment, :date_from, :date_to, :guests, :note)
  end
end
