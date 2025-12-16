import { motion } from 'framer-motion';
import { Library, BookOpen, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface HeaderProps {
  activeTab: 'catalog' | 'register';
  setActiveTab: (tab: 'catalog' | 'register') => void;
}

export const Header = ({ activeTab, setActiveTab }: HeaderProps) => {
  return (
    <header className="gradient-header text-primary-foreground sticky top-0 z-30 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3"
          >
            <div className="p-2 bg-primary-foreground/10 rounded-lg">
              <Library className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-xl font-display font-bold leading-none">Книги</h1>
              <span className="text-xs opacity-80">Сказочного Края</span>
            </div>
          </motion.div>

          <motion.nav
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex space-x-1 bg-foreground/10 p-1 rounded-xl"
          >
            <Button
              variant={activeTab === 'catalog' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('catalog')}
              className={activeTab === 'catalog' 
                ? 'bg-background text-foreground shadow-sm' 
                : 'text-primary-foreground hover:bg-foreground/10 hover:text-primary-foreground'
              }
            >
              <BookOpen className="w-4 h-4 mr-2" />
              Каталог
            </Button>
            <Button
              variant={activeTab === 'register' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('register')}
              className={activeTab === 'register' 
                ? 'bg-background text-foreground shadow-sm' 
                : 'text-primary-foreground hover:bg-foreground/10 hover:text-primary-foreground'
              }
            >
              <Users className="w-4 h-4 mr-2" />
              Читатели
            </Button>
          </motion.nav>
        </div>
      </div>
    </header>
  );
};
