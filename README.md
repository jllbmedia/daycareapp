# Daycare Management Application
## by Juan LLerena @ JLLBMedia v2.1

A comprehensive daycare management system built with modern web technologies. This application helps daycare providers manage children's attendance, daily activities, and parent communications efficiently.

## Tech Stack

### Frontend
- **Framework**: [Next.js](https://nextjs.org) 15.3.3 with App Router
- **Language**: TypeScript 5.3.3
- **UI Components**:
  - React 18.2.0
  - @headlessui/react for accessible UI components
  - @heroicons/react for icons
  - Tailwind CSS for styling

### Backend & Database
- **Backend**: Firebase/Firestore
- **Authentication**: Firebase Auth
- **Database**: Cloud Firestore
- **Hosting**: Vercel

### Form Handling & Validation
- react-hook-form for form management
- yup & zod for schema validation
- @hookform/resolvers for form validation

### State Management & Data Fetching
- React Context for global state
- react-firebase-hooks for Firebase integration
- Custom hooks for business logic

### Development Tools
- ESLint for code linting
- TypeScript for type safety
- Tailwind CSS for styling
- PostCSS & Autoprefixer for CSS processing

### Key Features
- Real-time updates with Firestore
- Type-safe database operations
- Responsive design
- Error boundaries for reliability
- Toast notifications for user feedback
- Comprehensive type definitions
- Modular component architecture

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
