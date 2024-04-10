# Frontend-Backend
## Backend: Flask App deployed on EC2 with Gunicorn and Nginx


### 

This repository contains the files and instructions necessary to deploy a Flask web application on an Amazon EC2 instance using Gunicorn as the WSGI HTTP server and Nginx as the reverse proxy server.

## Setup Instructions Followed

1. **EC2 Instance**: Launched an Amazon EC2 instance and ensured that the security group associated with the instance allows inbound traffic on ports 80 (HTTP) and 443 (HTTPS).

3. **SSH Access**: Connected to EC2 instance using SSH. 
```bash
ssh -i <key.pem> ec2-user@<instance_public_ip>
```

4. **Install Dependencies**: Updated the package manager and installed the necessary dependencies.

5. **Virtual Environment**: Set up a virtual environment and activated it.

6. **Install Flask App Dependencies**: Installed the required Python packages for our Flask application.

7. **Configure Gunicorn**: Created a system service file for Gunicorn to manage the Flask application.

8. **Start Gunicorn Service**: Started the Gunicorn service and enabled it to run on system boot.
```bash
# Start the Flask app service
sudo systemctl start flask_app

# Enable the Flask app service to start on boot
sudo systemctl enable flask_app
```

9. **Configure Nginx**: Created a server block configuration file for Flask application in Nginx.



## Access our Backend service: 
Simply visit our EC2's public IP: https://3.14.250.99/
<br> Update: Stoped the AWS EC2 instance to save resources. The backend can still be run locally.

## Additional Resources
- [Flask Documentation](https://flask.palletsprojects.com/en/2.1.x/)
- [Gunicorn Documentation](https://docs.gunicorn.org/en/stable/)
- [Nginx Documentation](https://nginx.org/en/docs/)

