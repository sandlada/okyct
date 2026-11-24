using Sandlada.Okyct.Domain.Models;

namespace Sandlada.Okyct.Domain.Services;

public static partial class ColorScience
{
    private const double ApcaDeltaYMin = 0.0005;

    public static double GetApcaContrast(ColorToneInput txtToneOrColor, ColorToneInput bgToneOrColor)
    {
        var txtY = ToneToY(ResolveToneInput(txtToneOrColor));
        var bgY = ToneToY(ResolveToneInput(bgToneOrColor));
        if (txtY < ApcaBlkThrs)
        {
            txtY += Math.Pow(ApcaBlkThrs - txtY, ApcaBlkClmp);
        }
        if (bgY < ApcaBlkThrs)
        {
            bgY += Math.Pow(ApcaBlkThrs - bgY, ApcaBlkClmp);
        }
        if (Math.Abs(bgY - txtY) < ApcaDeltaYMin)
        {
            return 0;
        }
        if (bgY > txtY)
        {
            var sapc = (Math.Pow(bgY, 0.56) - Math.Pow(txtY, 0.57)) * ApcaScale;
            if (sapc < ApcaLoClip)
            {
                return 0;
            }
            return RoundToInteger((sapc - ApcaLoConOffset) * 100);
        }
        else
        {
            var sapc = (Math.Pow(bgY, 0.65) - Math.Pow(txtY, 0.62)) * ApcaScale;
            if (sapc > -ApcaLoClip)
            {
                return 0;
            }
            return RoundToInteger((sapc + ApcaLoConOffset) * 100);
        }
    }
}
