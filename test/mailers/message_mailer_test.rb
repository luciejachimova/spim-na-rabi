require "test_helper"

class MessageMailerTest < ActionMailer::TestCase
  test "contact_message builds email with reply_to" do
    message = Message.new(
      name: "Lucie",
      email: "lucie@example.com",
      phone: "+420123456789",
      body: "Dobry den, rada bych se zeptala na dostupnost."
    )

    email = MessageMailer.contact_message(message)

    assert_equal [ "spimnarabi@seznam.cz" ], email.to
    assert_equal [ "lucie@example.com" ], email.reply_to
    assert_equal "Nová zpráva z formuláře Spim na Rabí", email.subject
    assert_includes email.body.encoded, "Lucie"
    assert_includes email.body.encoded, "Dobry den"
  end
end
