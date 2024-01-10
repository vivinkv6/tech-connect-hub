# TechConnectHub

TechConnectHub is a platform that allows tech organizers to post events, enabling everyone to participate. It benefits both event organizers, who can reach targeted participants, and participants, who can focus on their favorite tech events.

## Description

TechConnectHub is a web application designed to connect tech enthusiasts with relevant events. It provides a platform for tech organizers to post their events, allowing participants to discover and register for these events. The application caters to different user roles, including users, publishers, verifiers, and admins, each with specific functionalities and responsibilities.

## User Roles

- User: Can view all the events and register for events using the link provided by the publisher.
- Publisher: Can post events and manage event details.
- Verifier: Verifies publisher profiles and decides whether the publisher is eligible to post event details.
- Admin: Manages the community, user roles, and overall application functionality.

## Technologies

The application is built using the following technologies:

- Node.js: JavaScript runtime for server-side logic.
- Express.js: Web application framework for Node.js.
- EJS: Embedded JavaScript templates for dynamic content generation.
- Bootstrap: Front-end framework for responsive and mobile-first web development.
- Sequelize: Promise-based Node.js ORM for PostgreSQL.
- PostgreSQL: Open-source relational database management system.
- JWT: JSON Web Tokens for authentication and authorization
- Cloudinary: Cloud platform to upload multimedia contents.

## Installation

To run the application locally, follow these steps:

1. Clone the repository from [https://github.com/vivinkv6/tech-connect-hub].
2. Install dependencies using `npm install`.
3. Set up the PostgreSQL database and configure the connection.
4. Run the application using `node app.js`.


## Usage

1. Register as a user, publisher, verifier, or admin based on your role.
2. Explore and participate in tech events listed on the platform.
3. Publishers can post new events, manage event details, and engage with participants.
4. Verifiers can manage and verify publisher profiles to maintain the quality of event listings.
5. Admins have the authority to manage the community, user roles, and overall application functionality.

## User Dashboards

### User Dashboard
![User Dashboard](user_dashboard_image_url)

### Publisher Dashboard
![Publisher Dashboard](publisher_dashboard_image_url)

### Verifier Dashboard
![Verifier Dashboard](verifier_dashboard_image_url)

### Admin Dashboard
![Admin Dashboard](admin_dashboard_image_url)

## License

This project is licensed under the [MIT License](link-to-license). You can find the license details in the `LICENSE` file.
