# app/controllers/pages_controller.rb

class PagesController < ApplicationController
  def home; end

  def o_nas; end

  def galerie
    @images = [
      { src: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80", alt: "Útulný interiér apartmánu" },
      { src: "https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=1200&q=80", alt: "Ložnice s přírodním světlem" },
      { src: "https://images.unsplash.com/photo-1554995207-c18c203602cb?auto=format&fit=crop&w=1200&q=80", alt: "Obývací část apartmánu" },
      { src: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80", alt: "Krajina v okolí Rabí" },
      { src: "https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&w=1200&q=80", alt: "Historická kamenná architektura" },
      { src: "https://images.unsplash.com/photo-1556911220-bff31c812dba?auto=format&fit=crop&w=1200&q=80", alt: "Kuchyně apartmánu" },
      { src: "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=1200&q=80", alt: "Výhled do krajiny" },
      { src: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80", alt: "Detail vybavení apartmánu" },
      { src: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80", alt: "Příroda na Šumavě" },
    ]
  end

  def cenik; end

  def kontakt
    @message = Message.new
  end

  def rezervovat
    redirect_to root_path(anchor: "rezervace")
  end
end
