import Link from "next/link";

const Footer = () => {
  return (
    <footer className="border-t text-center py-4 text-sm mt-10">
      Made by{" "}
      <Link
        href="https://x.com/inclinedadarsh"
        target="_blank"
        rel="noopener noreferrer"
        className="underline-offset-4 underline hover:no-underline"
      >
        Adarsh
      </Link>
      ,{" "}
      <Link
        href="https://x.com/lullabyshreya/"
        target="_blank"
        rel="noopener noreferrer"
        className="underline-offset-4 underline hover:no-underline"
      >
        Shreya
      </Link>{" "}
      and{" "}
      <Link
        href="https://x.com/adityab29_"
        target="_blank"
        rel="noopener noreferrer"
        className="underline-offset-4 underline hover:no-underline"
      >
        Aditya
      </Link>{" "}
      for{" "}
      <Link
        href="https://www.wemakedevs.org/hackathons/futurestack25"
        target="_blank"
        rel="noopener noreferrer"
        className="underline-offset-4 underline hover:no-underline"
      >
        Futurestack GenAI Hackathon
      </Link>
      .
    </footer>
  );
};

export default Footer;
