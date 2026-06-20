package com.nexify.connect.ui.components

import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsPressedAsState
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.blur
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.hapticfeedback.HapticFeedbackType
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalHapticFeedback
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavController
import coil.compose.AsyncImage
import com.nexify.connect.ui.theme.*

@Composable
fun GlassmorphicCard(
    modifier: Modifier = Modifier,
    borderStroke: BorderStroke = BorderStroke(
        width = 1.dp,
        brush = Brush.horizontalGradient(
            colors = listOf(CyanNeon.copy(alpha = 0.35f), PurpleNeon.copy(alpha = 0.35f))
        )
    ),
    onClick: (() -> Unit)? = null,
    content: @Composable ColumnScope.() -> Unit
) {
    val baseModifier = modifier
        .clip(RoundedCornerShape(20.dp))
        .background(CardBg)
        .border(borderStroke, RoundedCornerShape(20.dp))
        
    val finalModifier = if (onClick != null) {
        baseModifier.clickable { onClick() }
    } else {
        baseModifier
    }

    Column(
        modifier = finalModifier.padding(16.dp),
        content = content
    )
}

@Composable
fun PresenceIndicator(
    imageUrl: String,
    onlineStatus: Boolean,
    modifier: Modifier = Modifier,
    size: Int = 50
) {
    Box(
        modifier = modifier.size(size.dp),
        contentAlignment = Alignment.BottomEnd
    ) {
        AsyncImage(
            model = imageUrl,
            contentDescription = "User Avatar",
            contentScale = ContentScale.Crop,
            modifier = Modifier
                .fillMaxSize()
                .clip(CircleShape)
                .border(2.dp, Brush.horizontalGradient(listOf(PurpleNeon, CyanNeon)), CircleShape)
        )
        val presenceColor = if (onlineStatus) CyanNeon else Color.Gray
        val borderGlow = if (onlineStatus) CyanGlow else Color.Transparent

        Box(
            modifier = Modifier
                .size((size * 0.28).dp)
                .clip(CircleShape)
                .background(presenceColor)
                .border(1.5.dp, Color.Black, CircleShape)
        )
    }
}

@Composable
fun PremiumButton(
    text: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    colors: List<Color> = listOf(PurpleNeon, CyanNeon)
) {
    val haptic = LocalHapticFeedback.current
    val interactionSource = remember { MutableInteractionSource() }
    val isPressed by interactionSource.collectIsPressedAsState()
    
    val buttonGlowAlpha by animateFloatAsState(if (isPressed) 0.6f else 0.25f)
    val scaleFactor by animateFloatAsState(if (isPressed) 0.96f else 1.0f)
    
    Box(
        contentAlignment = Alignment.Center,
        modifier = modifier
            .padding(vertical = 4.dp)
            .graphicsLayer(scaleX = scaleFactor, scaleY = scaleFactor)
    ) {
        // Neon ambient shadow glow behind button
        Box(
            modifier = Modifier
                .matchParentSize()
                .blur(10.dp)
                .clip(CircleShape)
                .background(
                    Brush.horizontalGradient(colors),
                    alpha = buttonGlowAlpha
                )
        )
        
        Button(
            onClick = {
                haptic.performHapticFeedback(HapticFeedbackType.LongPress)
                onClick()
            },
            interactionSource = interactionSource,
            colors = ButtonDefaults.buttonColors(containerColor = Color.Transparent),
            contentPadding = PaddingValues(),
            modifier = Modifier
                .fillMaxWidth()
                .clip(CircleShape)
                .background(Brush.horizontalGradient(colors))
                .border(
                    BorderStroke(1.dp, Color.White.copy(alpha = 0.25f)),
                    CircleShape
                )
        ) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 14.dp, horizontal = 24.dp),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = text,
                    color = Color.White,
                    fontWeight = FontWeight.ExtraBold,
                    fontSize = 14.sp,
                    letterSpacing = 1.sp
                )
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PremiumTextField(
    value: String,
    onValueChange: (String) -> Unit,
    placeholder: String,
    modifier: Modifier = Modifier,
    leadingIcon: @Composable (() -> Unit)? = null,
    trailingIcon: @Composable (() -> Unit)? = null,
    visualTransformation: VisualTransformation = VisualTransformation.None,
    keyboardOptions: KeyboardOptions = KeyboardOptions.Default
) {
    OutlinedTextField(
        value = value,
        onValueChange = onValueChange,
        placeholder = { Text(text = placeholder, color = TextMuted) },
        leadingIcon = leadingIcon,
        trailingIcon = trailingIcon,
        visualTransformation = visualTransformation,
        keyboardOptions = keyboardOptions,
        colors = TextFieldDefaults.outlinedTextFieldColors(
            focusedBorderColor = CyanNeon,
            unfocusedBorderColor = CardBorder,
            containerColor = Color(0x660A0A0F),
            focusedTextColor = Color.White,
            unfocusedTextColor = Color.White
        ),
        shape = RoundedCornerShape(20.dp),
        modifier = modifier.fillMaxWidth()
    )
}

@Composable
fun UniversalBackButton(
    navController: NavController,
    modifier: Modifier = Modifier,
    onClick: (() -> Unit)? = null
) {
    val haptic = LocalHapticFeedback.current
    val interactionSource = remember { MutableInteractionSource() }
    val isPressed by interactionSource.collectIsPressedAsState()
    
    val glowAlpha by animateFloatAsState(if (isPressed) 0.8f else 0.0f)
    val borderGlowColor = if (isPressed) CyanNeon else Color.White.copy(alpha = 0.15f)
    
    Box(
        contentAlignment = Alignment.Center,
        modifier = modifier.size(44.dp)
    ) {
        // Glowing halo behind the button when pressed
        if (glowAlpha > 0f) {
            Box(
                modifier = Modifier
                    .size(42.dp)
                    .blur(6.dp)
                    .clip(CircleShape)
                    .background(CyanNeon.copy(alpha = glowAlpha))
            )
        }
        
        IconButton(
            onClick = {
                haptic.performHapticFeedback(HapticFeedbackType.LongPress)
                if (onClick != null) {
                    onClick()
                } else {
                    navController.popBackStack()
                }
            },
            interactionSource = interactionSource,
            modifier = Modifier
                .size(40.dp)
                .clip(CircleShape)
                .background(Color(0x66161128)) // glass transparent fill
                .border(BorderStroke(1.dp, borderGlowColor), CircleShape)
        ) {
            Icon(
                imageVector = Icons.Default.ArrowBack,
                contentDescription = "Navigate Back",
                tint = if (isPressed) CyanNeon else Color.White,
                modifier = Modifier.size(20.dp)
            )
        }
    }
}

@Composable
fun PremiumCard(
    modifier: Modifier = Modifier,
    borderStroke: BorderStroke = BorderStroke(1.dp, CardBorder),
    onClick: (() -> Unit)? = null,
    content: @Composable ColumnScope.() -> Unit
) {
    GlassmorphicCard(
        modifier = modifier,
        borderStroke = borderStroke,
        onClick = onClick,
        content = content
    )
}

@Composable
fun TabButton(
    text: String,
    active: Boolean,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    val haptic = LocalHapticFeedback.current
    
    Box(
        modifier = modifier
            .clip(RoundedCornerShape(12.dp))
            .background(if (active) Color(0x2200DFD8) else Color(0x10FFFFFF))
            .border(
                1.dp,
                if (active) CyanNeon else Color.White.copy(alpha = 0.15f),
                RoundedCornerShape(12.dp)
            )
            .clickable {
                haptic.performHapticFeedback(HapticFeedbackType.LongPress)
                onClick()
            }
            .padding(vertical = 8.dp, horizontal = 16.dp),
        contentAlignment = Alignment.Center
    ) {
        Text(
            text = text,
            color = if (active) CyanNeon else Color.White,
            fontWeight = if (active) FontWeight.Bold else FontWeight.Medium,
            fontSize = 14.sp
        )
    }
}


