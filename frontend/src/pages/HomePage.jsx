import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ScanFace, ArrowRight, ShieldCheck, Zap, Users } from 'lucide-react';

const HomePage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-900 font-sans text-white overflow-hidden relative">
      {}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full mix-blend-screen filter blur-[120px] opacity-20 animate-pulse bg-blue-600"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] rounded-full mix-blend-screen filter blur-[120px] opacity-20 animate-pulse bg-purple-600" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="relative z-10">
        {}
        <header className="px-6 py-6 lg:px-12 flex justify-between items-center backdrop-blur-sm border-b border-white/10">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-2 rounded-xl">
              <ScanFace size={24} className="text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight">AI Attend</span>
          </div>
          <button 
            onClick={() => navigate('/login')}
            className="text-sm font-semibold bg-white text-gray-900 px-5 py-2.5 rounded-full hover:bg-gray-100 transition shadow-lg hover:shadow-xl"
          >
            Sign In
          </button>
        </header>

        {}
        <main className="max-w-6xl mx-auto px-6 pt-24 pb-16 text-center">
          
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-[1.05] mb-8 text-transparent bg-clip-text bg-gradient-to-br from-white via-gray-200 to-gray-500 drop-shadow-sm pb-2">
            Automate Attendance.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-500">Empower Educators.</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-400 mb-12 max-w-3xl mx-auto leading-relaxed font-light">
            Eliminate manual roll calls forever. Our platform uses edge-deployed facial recognition to log students instantly as they enter the lecture hall.
          </p>
          
          <button 
            onClick={() => navigate('/login')}
            className="group relative inline-flex items-center justify-center bg-white text-gray-900 font-bold text-lg px-8 py-4 rounded-full shadow-[0_0_40px_rgba(59,130,246,0.5)] hover:shadow-[0_0_60px_rgba(147,51,234,0.6)] hover:scale-105 transition-all duration-300"
          >
            Access Dashboard
            <ArrowRight className="ml-3 group-hover:translate-x-1 transition-transform" />
          </button>
        </main>

        {}
        <section className="max-w-6xl mx-auto px-6 py-20 mb-24">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black tracking-tight text-white mb-4">
              Designed for Scale. <br/> Built for Precision.
            </h2>
            <p className="text-gray-400 max-w-xl mx-auto text-lg">
              Everything you need to manage thousands of authentications per second, wrapped in an elegant interface.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {}
            <div className="col-span-1 md:col-span-8 group relative bg-white/5 border border-white/10 rounded-[2rem] overflow-hidden hover:border-blue-500/50 transition-all duration-500 backdrop-blur-xl">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="p-10 md:p-12 relative z-10 flex flex-col h-full justify-between">
                <div className="bg-blue-500/20 w-16 h-16 rounded-2xl flex items-center justify-center mb-8 border border-blue-500/30 backdrop-blur-md">
                  <Zap className="text-blue-400 w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-3xl font-bold text-white mb-4">Zero Friction Capture</h3>
                  <p className="text-gray-400 text-lg max-w-lg leading-relaxed">
                    Our edge-optimized models detect and log students seamlessly as they walk in. No RFID taps, no manual roll calls, just 100% ambient processing.
                  </p>
                </div>
              </div>
              <div className="absolute right-0 bottom-0 top-0 w-1/2 bg-gradient-to-l from-blue-500/10 to-transparent pointer-events-none"></div>
            </div>

            {}
            <div className="col-span-1 md:col-span-4 group relative bg-white/5 border border-white/10 rounded-[2rem] overflow-hidden hover:border-purple-500/50 transition-all duration-500 backdrop-blur-xl">
              <div className="absolute inset-0 bg-gradient-to-b from-purple-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="p-10 relative z-10 flex flex-col h-full">
                <div className="bg-purple-500/20 w-14 h-14 rounded-2xl flex items-center justify-center mb-6 border border-purple-500/30 backdrop-blur-md">
                  <ShieldCheck className="text-purple-400 w-7 h-7" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">Immutable Security</h3>
                <p className="text-gray-400 leading-relaxed flex-grow">
                  Attendance logs are cryptographically sealed, entirely preventing buddy punching.
                </p>
                <div className="mt-8 pt-6 border-t border-white/10 text-sm font-semibold text-purple-400 flex items-center group-hover:text-purple-300 transition-colors">
                  Enterprise Grade <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>

            {}
            <div className="col-span-1 md:col-span-5 group relative bg-white/5 border border-white/10 rounded-[2rem] overflow-hidden hover:border-emerald-500/50 transition-all duration-500 backdrop-blur-xl">
               <div className="absolute inset-0 bg-gradient-to-tr from-emerald-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
               <div className="p-8 md:p-10 relative z-10 flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-6">
                 <div className="bg-emerald-500/20 w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0 border border-emerald-500/30 backdrop-blur-md">
                   <Users className="text-emerald-400 w-8 h-8" />
                 </div>
                 <div>
                   <h3 className="text-xl font-bold text-white mb-2">Multi-Role Architecture</h3>
                   <p className="text-gray-400 text-sm leading-relaxed">Dedicated interfaces for Admins, Teachers, and Students to manage their operational domains.</p>
                 </div>
               </div>
            </div>

            {}
            <div 
              onClick={() => navigate('/login')}
              className="col-span-1 md:col-span-7 group relative bg-gradient-to-r from-blue-600 to-indigo-600 border border-indigo-400/50 rounded-[2rem] overflow-hidden hover:shadow-[0_0_30px_rgba(79,70,229,0.4)] transition-all duration-500 flex items-center p-10 cursor-pointer shadow-2xl"
            >
              {}
              <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
              
              <div className="relative z-10 w-full flex flex-col sm:flex-row items-center justify-between">
                <div className="text-center sm:text-left mb-6 sm:mb-0">
                  <h3 className="text-3xl font-bold text-white mb-2">Ready for the future?</h3>
                  <p className="text-indigo-100">Transform your campus attendance instantly.</p>
                </div>
                <div className="bg-white/20 backdrop-blur-md rounded-full p-4 group-hover:bg-white group-hover:text-indigo-600 text-white transition-all duration-300">
                  <ArrowRight className="w-8 h-8 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>

          </div>
        </section>

        {}
        <footer className="w-full text-center py-8 border-t border-white/10 bg-black/20 backdrop-blur-sm">
          <p className="text-indigo-200/60 font-medium text-sm tracking-wide">
            Engineered with Precision by <br className="md:hidden" />
            <span className="text-indigo-400 font-bold ml-1">Atul Raj</span>, 
            <span className="text-indigo-400 font-bold ml-1">Ananda Sekhar Rauta</span>, 
            <span className="text-indigo-400 font-bold ml-1">Kaushal Kumar</span> & 
            <span className="text-indigo-400 font-bold ml-1">Biswajit Sahu</span>
          </p>
        </footer>
      </div>
    </div>
  );
};

export default HomePage;
