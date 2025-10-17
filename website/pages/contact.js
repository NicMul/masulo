import { useState } from 'react';
import { HomeLayout, Form, Row, Message, Meta } from 'components/lib';

export default function Contact(){

  const [sent, setSent] = useState(false);

  return (
    <HomeLayout>

      <Meta 
        title={'Your Page Title'}
        keywords={['your', 'keywords', 'go', 'here']}
        description='Your page description here'
        card='https://your_social_card_url.jpg'
      />

      <Row title='Contact Us'>

      { sent ? 
        <Message
          type='success'
          title='Message Sent'
          text='You will receive a response within 24 hours.' 
        /> :

        <Form 
          inputs={{
            name: {
              type: 'text',
              label: 'Name',
              placeholder: 'Your name',
              required: true,
              errorMessage: 'Please enter your name'
            }, 
            email: {
              type: 'email',
              label: 'Email',
              placeholder: 'Your email address',
              required: true,
            },
            message: {
              type: 'textarea',
              label: 'Your message',
              required: true,
              errorMessage: 'Please enter a message'
            }
          }}
          buttonText='Send Message'
          url='/utility/mail'
          method='post'
          callback={ () => setSent(true) }
        /> }

      </Row>
    </HomeLayout>
  )
}
