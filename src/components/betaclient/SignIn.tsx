"use client";

import React, { useState } from "react";
import { FaGoogle, FaFacebook, FaLinkedin, FaEnvelope } from "react-icons/fa";

interface SignInProps {
  onGoogleSignUp: (e: React.MouseEvent) => void;
  onFacebookSignUp: (e: React.MouseEvent) => void;
  onLinkedInSignUp: (e: React.MouseEvent) => void;
  onEmailSignUp: () => void;
  showCustomModal: (message: string) => void;
  isLoadingSocial?: "google" | "facebook" | "linkedin" | null;
}

const SignInComponent = ({
  onGoogleSignUp,
  onFacebookSignUp,
  onLinkedInSignUp,
  onEmailSignUp,
  showCustomModal,
  isLoadingSocial,
}: SignInProps) => {
  return (
    <div className="text-center">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">
        Join Our Beta Program
      </h2>
      <p className="text-gray-600 mb-8">
        Choose your preferred method to get started.
      </p>

             <div className="space-y-4 max-w-sm mx-auto">
         {/* Google Sign-Up Button */}
         <button
           type="button"
           onClick={onGoogleSignUp}
           disabled={isLoadingSocial !== null}
           className="w-full flex items-center justify-center bg-white border border-gray-300 text-gray-700 font-semibold py-3 px-4 rounded-lg shadow-sm hover:bg-gray-50 transition duration-300 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
           onMouseDown={(e) => e.preventDefault()}
           onTouchStart={(e) => e.preventDefault()}
         >
          <FaGoogle className="mr-3 text-red-500" size={20} />
          Sign up with Google
        </button>

                                   {/* Facebook Sign-Up Button */}
          <button
            type="button"
            onClick={onFacebookSignUp}
            disabled={isLoadingSocial !== null}
            className="w-full flex items-center justify-center bg-blue-600 text-white font-semibold py-3 px-4 rounded-lg shadow-md hover:bg-blue-700 transition duration-300 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
            onMouseDown={(e) => e.preventDefault()}
            onTouchStart={(e) => e.preventDefault()}
          >
          <FaFacebook className="mr-3" size={20} />
          Sign up with Facebook
        </button>

                                   {/* LinkedIn Sign-Up Button */}
          <button
            type="button"
            onClick={onLinkedInSignUp}
            disabled={isLoadingSocial !== null}
            className="w-full flex items-center justify-center bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg shadow-md hover:bg-blue-800 transition duration-300 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
            onMouseDown={(e) => e.preventDefault()}
            onTouchStart={(e) => e.preventDefault()}
          >
          <FaLinkedin className="mr-3" size={20} />
          Sign up with LinkedIn
        </button>
      </div>

      <div className="my-8 flex items-center justify-center">
        <span className="h-px bg-gray-300 flex-grow"></span>
        <span className="mx-4 text-gray-500 font-semibold">OR</span>
        <span className="h-px bg-gray-300 flex-grow"></span>
      </div>

             {/* Email Sign-Up Button */}
       <button
         type="button"
         onClick={onEmailSignUp}
         disabled={isLoadingSocial !== null}
         className="w-full max-w-sm mx-auto flex items-center justify-center bg-gray-600 text-white font-semibold py-3 px-4 rounded-lg shadow-md hover:bg-gray-700 transition duration-300 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
       >
        <FaEnvelope className="mr-3" size={20} />
        Sign up with Email
      </button>
    </div>
  );
};

export default SignInComponent;
