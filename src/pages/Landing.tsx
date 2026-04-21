
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, CheckCircle, Mail } from 'lucide-react';

const Landing = () => {
  const navigate = useNavigate();
  
  const handleSignIn = () => {
    navigate('/auth');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Hero Section */}
      <section className="pt-16 px-6 pb-12">
        <div className="container mx-auto max-w-lg text-center">
          <div className="flex justify-center mb-6">
            <img 
              src="/museio-gradient-logo.svg" 
              alt="Museio Logo" 
              className="h-24 md:h-24"
            />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900">
            Transform your Passion into a Business <span className="text-[#8A71CF]">Effortlessly</span>
          </h1>
          <p className="text-lg text-gray-700 mb-8">
            Track jobs, send invoices, and manage your finances all in one place.
          </p>
          <button
            onClick={handleSignIn}
            className="bg-[#8A71CF] text-white px-6 py-3 rounded-lg hover:bg-[#5e07a1] transition-colors"
          >
            Get Started
          </button>
        </div>
      </section>

      <section className=" bg-white">
        <div className="container mx-auto max-w-lg flex justify-center items-center">
          <img 
            src="/phone-landing-page.png" 
            alt="Iphone with Museio App" 
            className="h-auto md:h-auto"
          />
        </div>
      </section>
      
      {/* Features Section */}
      <section className="py-8 px-6 bg-white">
        <div className="container mx-auto max-w-lg">          
          <div className="space-y-6">
            <div className="flex items-start">
              <CheckCircle className="text-[#8A71CF] mr-3 shrink-0" />
              <div>
                <h3 className="font-semibold mb-1">Simple Job Management</h3>
                <p className="text-gray-600">Keep track of all your jobs in one place, with calendar integration and reminders.</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <CheckCircle className="text-[#8A71CF] mr-3 shrink-0" />
              <div>
                <h3 className="font-semibold mb-1">Professional Invoicing</h3>
                <p className="text-gray-600">Generate and send professional invoices to your clients in 1 click.</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <CheckCircle className="text-[#8A71CF] mr-3 shrink-0" />
              <div>
                <h3 className="font-semibold mb-1">Financial Overview</h3>
                <p className="text-gray-600">Get insights into your earnings with financial reports and forecasts.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-8">
        <div className="container mx-auto max-w-lg flex justify-center items-center gap-4">
          <a
            href="https://apps.apple.com/au/app/museio/id6747413453"
            target="_blank"
            rel="noopener noreferrer"
          >
            <img
              src="/Download_on_the_App_Store_Badge_US-UK_RGB_blk_092917.svg"
              alt="Download on the App Store"
              className="h-12 w-auto"
            />
          </a>
          <a
            href="https://play.google.com/store/apps/details?id=audaciangroup.com"
            target="_blank"
            rel="noopener noreferrer"
          >
            <img
              src="/GetItOnGooglePlay_Badge_Web_color_English.png"
              alt="Get it on Google Play"
              className="h-12 w-auto"
            />
          </a>
        </div>
    </section>


      {/* Partner Section */}
      <section className="py-6 px-6 bg-white">
        <div className="container mx-auto max-w-lg text-center">
          <h2 className="text-xl font-bold mb-6 text-center">Proudly supported by our industry partners</h2>
          <div className="flex justify-center gap-4">
            <p  className="h-20 md:h-20">
              <a href="https://sydneydjschool.com/" target="_blank" rel="noopener noreferrer">
              <img 
                src="/sydney-dj-school-logo.png" 
                alt="Sydney DJ School Logo" 
              />
              </a>
            </p>
            <p  className="h-20 md:h-20">
              <a href="https://www.instagram.com/asiesrecords/" target="_blank" rel="noopener noreferrer">
            <img
              src="/asi-es-logo.png"
              alt="Asi es Logo"
            />
              </a>
            </p>
            <p  className="h-20 md:h-20">
              <a href="https://www.instagram.com/warehouseradio.au/" target="_blank" rel="noopener noreferrer">

            <img 
              src="/warehouse-radio-logo.png"
              alt="Warehouse Radio Logo" 
            />
              </a>
            </p>
            <p  className="h-20 md:h-20">
              <a href="https://auranightclub.com.au/" target="_blank" rel="noopener noreferrer">
                <img 
                  src="/aura-logo.png"
                  alt="AURA Logo" 
                />
              </a>
            </p>
            <p  className="h-20 md:h-20">
              <a href="https://cafedelmar.com.au/" target="_blank" rel="noopener noreferrer">

            <img
              src="/cafe-del-mare-logo.png"
              alt="Cafe Del Mare Logo"
            />
              </a>
            </p>
          </div>
        </div>
      </section>

      {/* Support Section */}
      <section className="py-6 px-6 bg-gray-50">
        <div className="container mx-auto max-w-lg text-center">
          <h2 className="text-2xl font-bold mb-4 text-center">Need Help?</h2>
          <div className="flex items-center justify-center mb-6">
            <Mail className="text-[#8A71CF] mr-2" size={20} />
            <a href="mailto:support@museioapp.com" className="text-[#7209B7] hover:underline">
              support@museioapp.com
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-6 text-center text-gray-500 text-sm">
        <div className="space-y-2">
          <p>&copy; {new Date().getFullYear()} Museio by Audacian Group Pty Ltd. All rights reserved.</p>
          <div>
            <button
              onClick={() => navigate('/terms-and-privacy')}
              className="text-[#7209B7] hover:underline"
            >
              Terms of Service & Privacy Policy
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
