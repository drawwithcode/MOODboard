# MOODboard

MOODboard is a project built in p5.js for the course **Creative Coding** at the Politecnico di Milano.

# Project Idea

 The main goal was to create an **interactive experience** where users can reconnect with their peers and other anonymous surfers through their emotions, to enable speculation around the theme of **sentient algorithms**.

# Interaction

 Users can see an **algorithmic representation** of their expression (neutral, happy, angry, sad, disgusted, surprised, fearful) that changes shape and color based on how they are feeling during that time. The representation is updated in **real-time**. Every user will be positioned according to their expression, creating **groups** based on shared emotion. The background will show a **generative artwork** that changes according to everyone's expression and the number of participants.

# Key Features

 We preferred to stick to **desktop** or **landscape mobile** because on portrait mobile the space was not enough for the experience. Besides the main frameworks and languages as HTML, CSS, p5.js, and socket.io we will use other libraries to achieve our goals, in particular face-api.js.

# Design challenges

 Look of the faces:
 Generative artwork as background

# Coding challenges

 face-api.js for emotions


 Frag/Glsl
 In order to develop the generative artwork for the background we used this particular add on to p5 that

# Miscellaneus

Heroku: The perfect server turned out to be heroku as it allows you to have a working server directly connected to the github repository facilitating the work and development of the web app.

CSS: for the aspect of button and about

P5.js

# Team

MOODboard was developed by:
Michele Bruno, Federica Laurencio, Valentina Pallacci, Federico Pozzi


# how to run

Be sure to have node installed: https://nodejs.org/

* install node dependencies: `npm install`
* run local server: `node server.js`
