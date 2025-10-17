// src/pages/referral/ReferralLinkCard.tsx

import { useState } from 'react';
import {  Mail, Twitter, Facebook, Share2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAppSelector } from '@/store/hooks';
import { useToast } from '@/components/ui/use-toast';

export const ReferralLinkCard = () => {
  const { toast } = useToast();
  const { info } = useAppSelector((state) => state.referrals);
  const [showCopied, setShowCopied] = useState(false);

  const getReferralLink = () => {
    if (!info?.code) return '';
    return `${window.location.origin}/register?ref=${info.code}`;
  };

  const handleCopyLink = async () => {
    const link = getReferralLink();
    if (!link) return;
    
    try {
      await navigator.clipboard.writeText(link);
      setShowCopied(true);
      toast({
        title: 'Copied!',
        description: 'Referral link copied to clipboard',
      });
      setTimeout(() => setShowCopied(false), 2000);
    } catch (err) {
      toast({
        title: 'Failed to copy',
        description: 'Please copy the link manually',
        variant: 'destructive',
      });
    }
  };

  const handleShare = (platform: 'email' | 'twitter' | 'facebook') => {
    const link = getReferralLink();
    if (!link) return;

    const message = encodeURIComponent(
      'Join me on Matrix Trading - The most advanced AI-powered trading platform. Use my referral link to get started:'
    );

    switch (platform) {
      case 'email':
        window.location.href = `mailto:?subject=${encodeURIComponent('Join Matrix Trading')}&body=${message}%20${link}`;
        break;
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?text=${message}&url=${link}`, '_blank');
        break;
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${link}`, '_blank');
        break;
    }
  };

  if (!info) return null;

  return (
    <Card className="rounded-lg bg-white dark:bg-gray-800 border border-emerald-800/0 shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 dark:text-emerald-100">
          <Share2 className="h-5 w-5 text-emerald-500" />
          Share Your Referral Link
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4  text-gray-900 dark:text-white">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex-1 relative">
            <input
              type="text"
              value={getReferralLink()}
              readOnly
                className="w-full pr-20 pl-3 py-2 dark:bg-gray-700/50 border border-white-800 rounded-md text-sm  focus:outline-none"
            />
            <Button
              size="sm"
              onClick={handleCopyLink}
                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 bg-emerald-500 hover:bg-emerald-600 text-white"
            >
              {showCopied ? 'Copied!' : 'Copy'}
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => handleShare('email')}>
            <Mail className="mr-2 h-4 w-4" />
            Email
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleShare('twitter')}>
            <Twitter className="mr-2 h-4 w-4" />
            Twitter
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleShare('facebook')}>
            <Facebook className="mr-2 h-4 w-4" />
            Facebook
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};