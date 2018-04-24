//Define all required templates in this file

// Generic Template : https://developers.facebook.com/docs/messenger-platform/send-messages/template/generic

exports.generic = {
    messaging_type: "RESPONSE",
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

exports.genericSquare = {
    messaging_type: "RESPONSE",
    recipient: {
        id: ""
    },
    message: {
        attachment: {
            type: "template",
            payload: {
                template_type: "generic",
                image_aspect_ratio: "square",
                elements: []
            }
        }
    }
};

//List Template : https://developers.facebook.com/docs/messenger-platform/send-messages/template/list

exports.listCompact = {
    messaging_type: "RESPONSE",
    recipient: {
        id: ""
    },
    message: {
        attachment: {
            type: "template",
            payload: {
                template_type: "list",
                top_element_style: "compact",
                elements: []
            }
        }
    }
};

//List Template Large : https://developers.facebook.com/docs/messenger-platform/send-messages/template/list

exports.listLarge = {
    messaging_type: "RESPONSE",
    recipient: {
        id: ""
    },
    message: {
        attachment: {
            type: "template",
            payload: {
                template_type: "list",
                top_element_style: "large",
                elements: []
            }
        }
    }
};

// Simple Text Message Template

exports.textmsg = {
    messaging_type: "RESPONSE",
    recipient: {
        id: ""
    },
    message: {
        text: "",
        metadata: "METADATA"
    }
}

// Show Typing Icon Template

exports.typingOnInd = {
    messaging_type: "RESPONSE",
    recipient: {
        id: ""
    },
    sender_action: "typing_on"
};