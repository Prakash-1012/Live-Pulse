import { createBrowserRouter } from "react-router-dom";
import Landing from "./Landing";
import Login from "./Login";
import Signup from "./Signup";
import HostDashboard from "./HostDashboard";
import CreateSession from "./CreateSession";
import AddQuestion from "./AddQuestion";
import AIGenerator from "./AIGenerator";
import HostLiveControl from "./HostLiveControl";
import JoinSession from "./JoinSession";
import VotingScreen from "./VotingScreen";
import LiveResults from "./LiveResults";
import SessionEnd from "./SessionEnd";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Landing,
  },
  {
    path: "/login",
    Component: Login,
  },
  {
    path: "/signup",
    Component: Signup,
  },
  {
    path: "/dashboard",
    Component: HostDashboard,
  },
  {
    path: "/create-session",
    Component: CreateSession,
  },
  {
    path: "/add-question/:sessionId",
    Component: AddQuestion,
  },
  {
    path: "/ai-generator/:sessionId",
    Component: AIGenerator,
  },
  {
    path: "/host-live/:sessionId",
    Component: HostLiveControl,
  },
  {
    path: "/join",
    Component: JoinSession,
  },
  {
    path: "/vote/:sessionId",
    Component: VotingScreen,
  },
  {
    path: "/results/:sessionId",
    Component: LiveResults,
  },
  {
    path: "/session-end",
    Component: SessionEnd,
  },
]);
