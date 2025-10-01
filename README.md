# SkyGuard - AI-Powered Drone Surveillance System

SkyGuard is a modern web application that provides real-time drone surveillance and monitoring capabilities powered by artificial intelligence. The system enables users to connect to drones, monitor live video feeds, detect various events, and manage drone operations through an intuitive interface.

# Preview
![Image](https://private-user-images.githubusercontent.com/88955625/454243234-422d33f8-26ec-4118-9c9d-6f0dd800b307.png?jwt=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJnaXRodWIuY29tIiwiYXVkIjoicmF3LmdpdGh1YnVzZXJjb250ZW50LmNvbSIsImtleSI6ImtleTUiLCJleHAiOjE3NTkyOTIyNDIsIm5iZiI6MTc1OTI5MTk0MiwicGF0aCI6Ii84ODk1NTYyNS80NTQyNDMyMzQtNDIyZDMzZjgtMjZlYy00MTE4LTljOWQtNmYwZGQ4MDBiMzA3LnBuZz9YLUFtei1BbGdvcml0aG09QVdTNC1ITUFDLVNIQTI1NiZYLUFtei1DcmVkZW50aWFsPUFLSUFWQ09EWUxTQTUzUFFLNFpBJTJGMjAyNTEwMDElMkZ1cy1lYXN0LTElMkZzMyUyRmF3czRfcmVxdWVzdCZYLUFtei1EYXRlPTIwMjUxMDAxVDA0MTIyMlomWC1BbXotRXhwaXJlcz0zMDAmWC1BbXotU2lnbmF0dXJlPWRkYTQ0NzExMmM3YTBjY2VmYzVkZGI5MzEyZjc5YmFjYmVmOGQxNTk0YjBkODA4Y2ZiMjJjY2MyMzlmZDU5MGImWC1BbXotU2lnbmVkSGVhZGVycz1ob3N0In0.hk42_Y1Pa_2273_-8otFhDk6ozU1tSg_vFZftJKx3Xs)
🌐[Live Link](https://drone-surveillance-psi.vercel.app/)

## Features

- 🎥 Real-time video streaming and analysis
- 🤖 AI-powered object and event detection
- 📊 Interactive analytics dashboard
- 🗺️ Map visualization and tracking
- 🔔 Real-time alerts and notifications
- ⚙️ Advanced drone settings and configuration
- 🌙 Night mode capabilities
- 📱 Responsive design for all devices

## Tech Stack

- **Frontend**: React + TypeScript + Vite
- **UI Components**: Custom UI components with Tailwind CSS
- **State Management**: React Context API
- **Styling**: Tailwind CSS
- **Icons**: Lucide Icons
- **Development**: ESLint, TypeScript

## Prerequisites

- Python
- Uvicorn
- Modern web browser

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/skyguard.git
cd skyguard
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Start the development server:
```bash
npm run dev
# or
yarn dev
```

4. Open [http://localhost:5173](http://localhost:5173) in your browser.

## Project Structure

```
skyguard/
├── src/
│   ├── components/        # React components
│   ├── contexts/         # React contexts
│   ├── types/           # TypeScript type definitions
│   ├── lib/             # Utility functions
│   └── main.tsx         # Application entry point
├── public/              # Static assets
└── package.json         # Project dependencies
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [React](https://reactjs.org/)
- [Vite](https://vitejs.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Lucide Icons](https://lucide.dev/)

# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type aware lint rules:

- Configure the top-level `parserOptions` property like this:

```js
export default {
  // other rules...
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    project: ['./tsconfig.json', './tsconfig.node.json'],
    tsconfigRootDir: __dirname,
  },
}
```

- Replace `plugin:@typescript-eslint/recommended` to `plugin:@typescript-eslint/recommended-type-checked` or `plugin:@typescript-eslint/strict-type-checked`
- Optionally add `plugin:@typescript-eslint/stylistic-type-checked`
- Install [eslint-plugin-react](https://github.com/jsx-eslint/eslint-plugin-react) and add `plugin:react/recommended` & `plugin:react/jsx-runtime` to the `extends` list
