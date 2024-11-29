import { PaythenaLogo } from "./PaythenaLogo";

export const Footer = () => {
  return (
    <footer className="min-h-0 p-5 bg-base-200">
      <div className="w-full max-w-7xl mx-auto">
        <div className="flex justify-center items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="font-semibold">Paythena</span>
          </div>
          <span className="text-base-content/70">·</span>
          <div className="flex items-center gap-2">
            <span className="text-base-content/70">Powered by</span>
            <a
              href="https://ethena.fi/"
              target="_blank"
              rel="noreferrer"
              className="link hover:text-primary font-semibold"
            >
              Ethena Protocol
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
