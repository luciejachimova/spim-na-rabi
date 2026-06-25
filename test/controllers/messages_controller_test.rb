require "test_helper"

class MessagesControllerTest < ActionDispatch::IntegrationTest
  test "sends email for valid contact form submission" do
    assert_emails 1 do
      post kontakt_path, params: {
        message: {
          name: "Lucie",
          email: "lucie@example.com",
          phone: "+420123456789",
          body: "Mam zajem o ubytovani."
        }
      }
    end

    assert_redirected_to kontakt_path
  end

  test "does not send email for invalid contact form submission" do
    assert_no_emails do
      post kontakt_path, params: {
        message: {
          name: "",
          email: "spatny-email",
          body: ""
        }
      }
    end

    assert_response :unprocessable_entity
  end
end
