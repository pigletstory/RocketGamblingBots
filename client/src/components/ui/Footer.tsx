import { Link } from 'wouter';

export default function Footer() {
  return (
    <footer className="bg-discord-darker py-4 px-6 text-discord-muted text-sm">
      <div className="container mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <p>Rocket Gambling Bot &copy; {new Date().getFullYear()}</p>
            <p className="text-xs mt-1">
              Players start with 1,000 cash and level 0. Play games, win cash, get to the top of the leaderboards!
            </p>
          </div>
          <div className="flex space-x-4">
            <a 
              href="#" 
              className="hover:text-white transition duration-150 ease-in-out"
              onClick={(e) => {
                e.preventDefault();
                window.open('https://discord.gg/your-support-server', '_blank');
              }}
            >
              Support Server
            </a>
            <Link 
              href="/documentation"
              className="hover:text-white transition duration-150 ease-in-out"
            >
              Documentation
            </Link>
            <Link 
              href="/privacy"
              className="hover:text-white transition duration-150 ease-in-out"
            >
              Privacy Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
