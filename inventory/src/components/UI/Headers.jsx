import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleUser } from '@fortawesome/free-solid-svg-icons';
import { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../../context/AuthContext';

// Hook to track scroll
function useScrolled(threshold = 10) {
    const [scrolled, setScrolled] = useState(false);
    useEffect(() => {
        console.log(window.scrollY);
        const onScroll = () => setScrolled(window.scrollY > threshold);
        window.addEventListener('scroll', onScroll);
        return () => window.removeEventListener('scroll', onScroll);
    }, [threshold]);
    return scrolled;
}

// Base header style
const headerBaseStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    zIndex: 100,
    height: '70px',
    padding: '10px 20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    transition: 'background-color 0.3s ease, box-shadow 0.3s ease',
    backgroundColor: 'transparent',  // Keep transparent initially
    boxSizing: 'border-box',

};

// Style when scrolled
const headerScrolledStyle = {
    backgroundColor: '#020129',  // Change to a whiteish color on scroll
    boxShadow: '0 2px 5px rgba(0, 0, 0, 0.1)',  // Add a shadow for the effect
};

export function GuestHeader() {
    const scrolled = useScrolled();
    return (
        <header style={{ ...headerBaseStyle, ...(scrolled ? headerScrolledStyle : {}) }}>
            <div className="logo"><h1>Inventory Management</h1></div>
            <nav>
                <Link to="/pages/welcome" className="home-btn">
                    <span>Home</span>
                </Link>
                <Link to="/pages/login" className="login-btn">
                    <span>Login</span>
                </Link>
                <Link to="/pages/register" className="register-btn">
                    <span>Register</span>
                </Link>
            </nav>
        </header>
    );
}

export function LoggedInHeader() {
    const { username } = useContext(AuthContext);
    const scrolled = useScrolled();
    return (
        <header style={{ ...headerBaseStyle, ...(scrolled ? headerScrolledStyle : {}) }}>
            <svg width="0" height="0" style={{ position: 'absolute' }}>
                <defs>
                    <linearGradient id="icon-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#ff2a6d" />
                        <stop offset="100%" stopColor="#05d9e8" />
                    </linearGradient>
                </defs>
            </svg>
            <div className="logo"><h1>Memory Trove</h1></div>
            <nav>
                <Link to="/pages/albumList" className="all-albums-btn">
                    <span>All Albums</span>
                </Link>
                <Link to="/pages/createAnAlbum" className="create-album-btn">
                    <span>Create an Album</span>
                </Link>
                <Link to="/pages/accountSettings" className="account-settings-btn">
                    <FontAwesomeIcon icon={faCircleUser} className='account-icon'/> 
                    <span>
                        {username || 'User'}
                    </span>
                    
                </Link>
            </nav>
        </header>
    );
}