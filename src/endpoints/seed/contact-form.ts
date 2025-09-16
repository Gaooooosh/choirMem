export const contactForm = {
  title: 'Contact Form',
  fields: [
    {
      name: 'name',
      label: 'Name',
      type: 'text',
      required: true,
    },
    {
      name: 'email',
      label: 'Email',
      type: 'email',
      required: true,
    },
    {
      name: 'message',
      label: 'Message',
      type: 'textarea',
      required: true,
    },
  ],
  submitButtonLabel: 'Send Message',
  confirmationType: 'message',
  confirmationMessage: [
    {
      children: [
        {
          text: 'Thank you for your message. We will get back to you soon.',
        },
      ],
    },
  ],
}