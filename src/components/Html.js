import React from 'react';

class Html extends React.Component {
  render() {
    return (
      <html>
      <head>
        <meta charSet="utf-8" />
        <title>React Router Example</title>
        <meta name="viewport" content="width=device-width, user-scalable=no" />
        <link rel="stylesheet" type="text/css" href="/public/styles.css"/>
      </head>
      <body>
      <div id="app" dangerouslySetInnerHTML={{__html: this.props.markup}}></div>
      <script dangerouslySetInnerHTML={{__html: this.props.state}}></script>
      <script src="/public/bundle.js" defer></script>
      <script src="https://maps.googleapis.com/maps/api/js?key=AIzaSyCpVI0dT4zjgVZLsbVB-FR7ENQdtZVf52I" async defer></script>
      </body>
      </html>
    )
  }
}

export default Html;