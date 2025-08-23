import LoginRegisterForm from '@/components/forms/LoginRegisterForm'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import React from 'react'

function LoginRegister() {
  return (
    <div>
        <Navbar />
        <div className="min-h-screen">
          <LoginRegisterForm/>
        </div>
        <Footer />
    </div>
  )
}

export default LoginRegister