import { AuthContext } from "../../contexts/AuthContext.jsx";
import {useState, useContext, useEffect} from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import { GuestHeader } from "../UI/Headers.jsx";
import Footer from "../UI/Footer.jsx";

  async function handle_submit(e){
        
        e.preventDefault();

        const promptElement = document.querySelector('.prompt');

        function setPromptColor(msgType) {
            if (msgType === 'error') 
                promptElement.style.color = "red";
            else if (msgType === 'success') 
                promptElement.style.color = "green";
            else 
                promptElement.style.color = "black"; // Default color
        }
        
        function areInputsInvalid(){
            //1. Check if null/blank/empty
            if (username_email === '' || password === ''){
                setPromptColor('error');
                setPrompt("Please fill in all fields.");
                return true;
            }

            //Check if username_email is an email or a username
            //If input is an email
            if (username_email.includes('@')){
                //Check if email is valid
                const email_regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

                //If email is not valid, set prompt and return
                if (!email_regex.test(username_email)){
                    setPromptColor('error');
                    setPrompt("Please enter a valid email address.");
                    return true;
                }
            }
            return false;
        }
        
        async function submitToBackend(){
            let response = {}; 
            try {
                    response = await axios.post('http://localhost/memory-trove-backend/login.php', {
                    username_email: username_email,
                    password: password,
                }, 
                {
                    headers: {
                        'Content-Type': 'application/json', 
                    }
                });
                console.log('Data sent!');
                setPromptColor(response.data.messageType);
                setPrompt(response.data.message); //Display connection message from the backend (IMPORTANT NI)
    
            } 
            catch (error) {
                console.error('Error sending data', error);
                setPromptColor('error');
                setPrompt("There was an error during registration.");
            }
            return response.data; 
        }
    }