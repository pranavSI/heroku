//Define all required templates in this file

// Generic Template : https://developers.facebook.com/docs/messenger-platform/send-messages/template/generic

exports.generic = {
    recipient: {
        id: ""
    },
    message: {
        attachment: {
            type: "template",
            payload: {
                template_type: "generic",
                elements: []
            }
        }
    }
};