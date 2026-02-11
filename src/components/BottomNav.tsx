import { useNavigate, useLocation } from "react-router-dom";
import { History, UserCircle, Settings } from "lucide-react";
import { useLang } from "@/hooks/use-lang";

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLang();

  const navItems = [
    { icon: History, label: t("chatHistory"), path: "/chat-history" },
    { icon: UserCircle, label: t("profile"), path: "/profile", center: true },
    { icon: Settings, label: t("settings"), path: "/settings" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40">
      <div className="max-w-md mx-auto relative">
        <div className="bg-card/95 dark:bg-card/95 backdrop-blur-xl border-t border-border shadow-[0_-4px_20px_hsl(0_0%_0%/0.08)] dark:shadow-[0_-4px_20px_hsl(0_0%_0%/0.3)] rounded-t-2xl px-6 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
          <div className="flex items-end justify-around">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;

              if (item.center) {
                return (
                  <button
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    className="flex flex-col items-center -mt-5 relative"
                  >
                    <div
                      className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all duration-200 ${
                        isActive
                          ? "bg-primary shadow-primary/30"
                          : "bg-primary/90 hover:bg-primary shadow-primary/20"
                      }`}
                    >
                      <Icon className="w-6 h-6 text-primary-foreground" />
                    </div>
                    <span
                      className={`text-[10px] mt-1 font-medium transition-colors ${
                        isActive ? "text-primary" : "text-muted-foreground"
                      }`}
                    >
                      {item.label}
                    </span>
                  </button>
                );
              }

              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className="flex flex-col items-center py-1.5 px-2 group"
                >
                  <Icon
                    className={`w-5 h-5 transition-colors ${
                      isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                    }`}
                  />
                  <span
                    className={`text-[10px] mt-1 font-medium transition-colors ${
                      isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                    }`}
                  >
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default BottomNav;
