import React from 'react'
import { useNavigate } from "react-router";
import { Helmet } from 'react-helmet'

import '../styles/root_variables.css'
import '../styles/LoginStyle.css'

import DepedLogo from '../images/DepedLogo.png'
import logo from '../images/logo.png'

function ForgotPassword() {
  const navigate = useNavigate();

  return (
    <div className="app-container">
      <Helmet>
        <title>Feeding Program | Forgot Password</title>
      </Helmet>

      <div className="login-section">
        <div className="login-content">
          <div className="brand-section">
            <div className="logo-icon">
              <img src={DepedLogo} alt="DepEd Logo" draggable="false" className='logo-deped' />
              <img src={logo} alt="Feeding Program Logo" draggable="false" className='logo-feedprogram' />
            </div>
            <h1 className="brand-title">Password Recovery</h1>
            <p className="brand-subtitle">Account recovery is controlled centrally for this portal.</p>
          </div>

          <div className="forgot-password-card">
            <div className="forgot-password-icon">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01M5.07 19h13.86c1.54 0 2.5-1.67 1.73-3l-6.93-12a2 2 0 00-3.46 0l-6.93 12c-.77 1.33.19 3 1.73 3z"
                />
              </svg>
            </div>

            <div className="forgot-password-copy">
              <h2>Feature Disabled</h2>
              <p>
                Admin disable this feature. Please contact the admin for password changing.
              </p>
            </div>

            <div className="forgot-password-note">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>
                If your school administrator supports password resets, ask them to update your account credentials directly.
              </span>
            </div>

            <div className="forgot-password-actions">
              <button
                type="button"
                className="submit-button"
                onClick={() => navigate("/login")}
              >
                Back to Login
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="features-section">
        <div className="decorative-circle-1"></div>
        <div className="decorative-circle-2"></div>

        <div className="features-content">
          <h2 className="features-title">Managed Access</h2>
          <p className="features-description">
            Teacher accounts in this portal are managed by the administrator to keep student records and feeding data secure.
          </p>
          <div className="features-list">
            <div className="feature-item">
              <div className="feature-icon">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="feature-content">
                <h4>Admin Controlled</h4>
                <p>Password changes are handled outside the self-service login flow.</p>
              </div>
            </div>
            <div className="feature-item">
              <div className="feature-icon">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="feature-content">
                <h4>Safer Access</h4>
                <p>Central handling reduces the chance of unauthorized account recovery requests.</p>
              </div>
            </div>
            <div className="feature-item">
              <div className="feature-icon">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="feature-content">
                <h4>Fast Direction</h4>
                <p>This page quickly directs teachers to the right support path instead of a broken reset form.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ForgotPassword
