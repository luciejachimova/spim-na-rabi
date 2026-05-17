Rails.application.routes.draw do
  get "up" => "rails/health#show", as: :rails_health_check

  root "pages#home"

  get  "/o-nas",     to: "pages#o_nas",    as: :o_nas
  get  "/galerie",   to: "pages#galerie",  as: :galerie
  get  "/cenik",     to: "pages#cenik",    as: :cenik
  get  "/rezervovat", to: "pages#rezervovat", as: :rezervovat
  post "/rezervovat", to: "reservations#create", as: :reservations

  # Kontakt — GET renders page, POST handles form
  get  "/kontakt",   to: "pages#kontakt",  as: :kontakt
  post "/kontakt",   to: "messages#create"
end
